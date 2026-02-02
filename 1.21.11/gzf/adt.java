import com.mojang.brigadier.arguments.ArgumentType;
import com.mojang.brigadier.builder.ArgumentBuilder;
import com.mojang.brigadier.tree.ArgumentCommandNode;
import com.mojang.brigadier.tree.CommandNode;
import com.mojang.brigadier.tree.LiteralCommandNode;
import com.mojang.brigadier.tree.RootCommandNode;
import it.unimi.dsi.fastutil.ints.IntOpenHashSet;
import it.unimi.dsi.fastutil.ints.IntSet;
import it.unimi.dsi.fastutil.ints.IntSets;
import it.unimi.dsi.fastutil.objects.Object2IntMap;
import it.unimi.dsi.fastutil.objects.Object2IntMaps;
import it.unimi.dsi.fastutil.objects.Object2IntOpenHashMap;
import it.unimi.dsi.fastutil.objects.ObjectArrayList;
import it.unimi.dsi.fastutil.objects.ObjectIterator;
import it.unimi.dsi.fastutil.objects.Object2IntMap.Entry;
import java.util.ArrayDeque;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Queue;
import java.util.function.BiPredicate;
import java.util.stream.Stream;
import org.jspecify.annotations.Nullable;

public class adt implements aay<adb> {
   public static final aao<wx, adt> a = aay.a(adt::a, adt::new);
   private static final byte b = 3;
   private static final byte c = 4;
   private static final byte d = 8;
   private static final byte e = 16;
   private static final byte f = 32;
   private static final byte g = 0;
   private static final byte h = 1;
   private static final byte i = 2;
   private final int j;
   private final List<adt.b> k;

   public <S> adt(RootCommandNode<S> $$0, adt.e<S> $$1) {
      Object2IntMap<CommandNode<S>> $$2 = a($$0);
      this.k = a($$2, $$1);
      this.j = $$2.getInt($$0);
   }

   private adt(wx $$0) {
      this.k = $$0.a(adt::b);
      this.j = $$0.l();
      a(this.k);
   }

   private void a(wx $$0) {
      $$0.a((Collection)this.k, (aaq)(($$0x, $$1) -> {
         $$1.a($$0x);
      }));
      $$0.c(this.j);
   }

   private static void a(List<adt.b> $$0, BiPredicate<adt.b, IntSet> $$1) {
      IntOpenHashSet $$2 = new IntOpenHashSet(IntSets.fromTo(0, $$0.size()));

      boolean $$3;
      do {
         if ($$2.isEmpty()) {
            return;
         }

         $$3 = $$2.removeIf(($$3x) -> {
            return $$1.test((adt.b)$$0.get($$3x), $$2);
         });
      } while($$3);

      throw new IllegalStateException("Server sent an impossible command tree");
   }

   private static void a(List<adt.b> $$0) {
      a($$0, adt.b::a);
      a($$0, adt.b::b);
   }

   private static <S> Object2IntMap<CommandNode<S>> a(RootCommandNode<S> $$0) {
      Object2IntMap<CommandNode<S>> $$1 = new Object2IntOpenHashMap();
      Queue<CommandNode<S>> $$2 = new ArrayDeque();
      $$2.add($$0);

      CommandNode $$3;
      while(($$3 = (CommandNode)$$2.poll()) != null) {
         if (!$$1.containsKey($$3)) {
            int $$4 = $$1.size();
            $$1.put($$3, $$4);
            $$2.addAll($$3.getChildren());
            if ($$3.getRedirect() != null) {
               $$2.add($$3.getRedirect());
            }
         }
      }

      return $$1;
   }

   private static <S> List<adt.b> a(Object2IntMap<CommandNode<S>> $$0, adt.e<S> $$1) {
      ObjectArrayList<adt.b> $$2 = new ObjectArrayList($$0.size());
      $$2.size($$0.size());
      ObjectIterator var3 = Object2IntMaps.fastIterable($$0).iterator();

      while(var3.hasNext()) {
         Entry<CommandNode<S>> $$3 = (Entry)var3.next();
         $$2.set($$3.getIntValue(), a((CommandNode)$$3.getKey(), $$1, $$0));
      }

      return $$2;
   }

   private static adt.b b(wx $$0) {
      byte $$1 = $$0.readByte();
      int[] $$2 = $$0.c();
      int $$3 = ($$1 & 8) != 0 ? $$0.l() : 0;
      adt.g $$4 = a($$0, $$1);
      return new adt.b($$4, $$1, $$3, $$2);
   }

   @Nullable
   private static adt.g a(wx $$0, byte $$1) {
      int $$2 = $$1 & 3;
      String $$8;
      if ($$2 == 2) {
         $$8 = $$0.p();
         int $$4 = $$0.l();
         ib<?, ?> $$5 = (ib)mi.v.a($$4);
         if ($$5 == null) {
            return null;
         } else {
            ib.a<?> $$6 = $$5.b($$0);
            amo $$7 = ($$1 & 16) != 0 ? $$0.q() : null;
            return new adt.a($$8, $$6, $$7);
         }
      } else if ($$2 == 1) {
         $$8 = $$0.p();
         return new adt.c($$8);
      } else {
         return null;
      }
   }

   private static <S> adt.b a(CommandNode<S> $$0, adt.e<S> $$1, Object2IntMap<CommandNode<S>> $$2) {
      int $$3 = 0;
      int $$5;
      if ($$0.getRedirect() != null) {
         $$3 |= 8;
         $$5 = $$2.getInt($$0.getRedirect());
      } else {
         $$5 = 0;
      }

      if ($$1.a($$0)) {
         $$3 |= 4;
      }

      if ($$1.b($$0)) {
         $$3 |= 32;
      }

      Objects.requireNonNull($$0);
      byte var7 = 0;
      Object $$13;
      switch($$0.typeSwitch<invokedynamic>($$0, var7)) {
      case 0:
         RootCommandNode<S> $$6 = (RootCommandNode)$$0;
         $$3 |= 0;
         $$13 = null;
         break;
      case 1:
         ArgumentCommandNode<S, ?> $$8 = (ArgumentCommandNode)$$0;
         amo $$9 = $$1.a($$8);
         $$13 = new adt.a($$8.getName(), ic.b($$8.getType()), $$9);
         $$3 |= 2;
         if ($$9 != null) {
            $$3 |= 16;
         }
         break;
      case 2:
         LiteralCommandNode<S> $$11 = (LiteralCommandNode)$$0;
         $$13 = new adt.c($$11.getLiteral());
         $$3 |= 1;
         break;
      default:
         throw new UnsupportedOperationException("Unknown node type " + String.valueOf($$0));
      }

      Stream var10000 = $$0.getChildren().stream();
      Objects.requireNonNull($$2);
      int[] $$14 = var10000.mapToInt($$2::getInt).toArray();
      return new adt.b((adt.g)$$13, $$3, $$5, $$14);
   }

   public aba<adt> a() {
      return ahz.r;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public <S> RootCommandNode<S> a(dz $$0, adt.d<S> $$1) {
      return (RootCommandNode)(new adt.f($$0, $$1, this.k)).a(this.j);
   }

   public interface e<S> {
      @Nullable
      amo a(ArgumentCommandNode<S, ?> var1);

      boolean a(CommandNode<S> var1);

      boolean b(CommandNode<S> var1);
   }

   static record b(@Nullable adt.g a, int b, int c, int[] d) {
      @Nullable
      final adt.g a;
      final int b;
      final int c;
      final int[] d;

      b(@Nullable adt.g param1, int param2, int param3, int[] param4) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
         this.d = $$3;
      }

      public void a(wx $$0) {
         $$0.l(this.b);
         $$0.a(this.d);
         if ((this.b & 8) != 0) {
            $$0.c(this.c);
         }

         if (this.a != null) {
            this.a.a($$0);
         }

      }

      public boolean a(IntSet $$0) {
         if ((this.b & 8) != 0) {
            return !$$0.contains(this.c);
         } else {
            return true;
         }
      }

      public boolean b(IntSet $$0) {
         int[] var2 = this.d;
         int var3 = var2.length;

         for(int var4 = 0; var4 < var3; ++var4) {
            int $$1 = var2[var4];
            if ($$0.contains($$1)) {
               return false;
            }
         }

         return true;
      }

      @Nullable
      public adt.g a() {
         return this.a;
      }

      public int b() {
         return this.b;
      }

      public int c() {
         return this.c;
      }

      public int[] d() {
         return this.d;
      }
   }

   private interface g {
      <S> ArgumentBuilder<S, ?> a(dz var1, adt.d<S> var2);

      void a(wx var1);
   }

   static record a(String a, ib.a<?> b, @Nullable amo c) implements adt.g {
      a(String param1, ib.a<?> param2, @Nullable amo param3) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
      }

      public <S> ArgumentBuilder<S, ?> a(dz $$0, adt.d<S> $$1) {
         ArgumentType<?> $$2 = this.b.b($$0);
         return $$1.a(this.a, $$2, this.c);
      }

      public void a(wx $$0) {
         $$0.a(this.a);
         a($$0, this.b);
         if (this.c != null) {
            $$0.a(this.c);
         }

      }

      private static <A extends ArgumentType<?>> void a(wx $$0, ib.a<A> $$1) {
         a($$0, $$1.a(), $$1);
      }

      private static <A extends ArgumentType<?>, T extends ib.a<A>> void a(wx $$0, ib<A, T> $$1, ib.a<A> $$2) {
         $$0.c(mi.v.a((Object)$$1));
         $$1.a($$2, $$0);
      }

      public String a() {
         return this.a;
      }

      public ib.a<?> b() {
         return this.b;
      }

      @Nullable
      public amo c() {
         return this.c;
      }
   }

   static record c(String a) implements adt.g {
      c(String param1) {
         this.a = $$0;
      }

      public <S> ArgumentBuilder<S, ?> a(dz $$0, adt.d<S> $$1) {
         return $$1.a(this.a);
      }

      public void a(wx $$0) {
         $$0.a(this.a);
      }

      public String a() {
         return this.a;
      }
   }

   static class f<S> {
      private final dz a;
      private final adt.d<S> b;
      private final List<adt.b> c;
      private final List<CommandNode<S>> d;

      f(dz $$0, adt.d<S> $$1, List<adt.b> $$2) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
         ObjectArrayList<CommandNode<S>> $$3 = new ObjectArrayList();
         $$3.size($$2.size());
         this.d = $$3;
      }

      public CommandNode<S> a(int $$0) {
         CommandNode<S> $$1 = (CommandNode)this.d.get($$0);
         if ($$1 != null) {
            return $$1;
         } else {
            adt.b $$2 = (adt.b)this.c.get($$0);
            Object $$7;
            if ($$2.a == null) {
               $$7 = new RootCommandNode();
            } else {
               ArgumentBuilder<S, ?> $$4 = $$2.a.a(this.a, this.b);
               if (($$2.b & 8) != 0) {
                  $$4.redirect(this.a($$2.c));
               }

               boolean $$5 = ($$2.b & 4) != 0;
               boolean $$6 = ($$2.b & 32) != 0;
               $$7 = this.b.a($$4, $$5, $$6).build();
            }

            this.d.set($$0, $$7);
            int[] var10 = $$2.d;
            int var11 = var10.length;

            for(int var12 = 0; var12 < var11; ++var12) {
               int $$8 = var10[var12];
               CommandNode<S> $$9 = this.a($$8);
               if (!($$9 instanceof RootCommandNode)) {
                  ((CommandNode)$$7).addChild($$9);
               }
            }

            return (CommandNode)$$7;
         }
      }
   }

   public interface d<S> {
      ArgumentBuilder<S, ?> a(String var1);

      ArgumentBuilder<S, ?> a(String var1, ArgumentType<?> var2, @Nullable amo var3);

      ArgumentBuilder<S, ?> a(ArgumentBuilder<S, ?> var1, boolean var2, boolean var3);
   }
}
