import com.google.common.base.MoreObjects;
import com.mojang.authlib.GameProfile;
import com.mojang.authlib.properties.PropertyMap;
import io.netty.buffer.ByteBuf;
import java.util.Collection;
import java.util.EnumSet;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import org.jspecify.annotations.Nullable;

public class afn implements aay<adb> {
   public static final aao<xq, afn> a = aay.a(afn::a, afn::new);
   private final EnumSet<afn.a> b;
   private final List<afn.b> c;

   public afn(EnumSet<afn.a> $$0, Collection<axg> $$1) {
      this.b = $$0;
      this.c = $$1.stream().map(afn.b::new).toList();
   }

   public afn(afn.a $$0, axg $$1) {
      this.b = EnumSet.of($$0);
      this.c = List.of(new afn.b($$1));
   }

   public static afn a(Collection<axg> $$0) {
      EnumSet<afn.a> $$1 = EnumSet.of(afn.a.a, afn.a.b, afn.a.c, afn.a.d, afn.a.e, afn.a.f, afn.a.h, afn.a.g);
      return new afn($$1, $$0);
   }

   private afn(xq $$0) {
      this.b = $$0.a(afn.a.class);
      this.c = $$0.a(($$0x) -> {
         afn.c $$1 = new afn.c($$0x.n());
         Iterator var3 = this.b.iterator();

         while(var3.hasNext()) {
            afn.a $$2 = (afn.a)var3.next();
            $$2.i.read($$1, (xq)$$0x);
         }

         return $$1.a();
      });
   }

   private void a(xq $$0) {
      $$0.a(this.b, afn.a.class);
      $$0.a(this.c, ($$0x, $$1) -> {
         $$0x.a($$1.a());
         Iterator var3 = this.b.iterator();

         while(var3.hasNext()) {
            afn.a $$2 = (afn.a)var3.next();
            $$2.j.write((xq)$$0x, $$1);
         }

      });
   }

   public aba<afn> a() {
      return ahz.al;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public EnumSet<afn.a> b() {
      return this.b;
   }

   public List<afn.b> e() {
      return this.c;
   }

   public List<afn.b> f() {
      return this.b.contains(afn.a.a) ? this.c : List.of();
   }

   public String toString() {
      return MoreObjects.toStringHelper(this).add("actions", this.b).add("entries", this.c).toString();
   }

   public static record b(UUID a, @Nullable GameProfile b, boolean c, int d, dwl e, @Nullable yh f, boolean g, int h, @Nullable yz.a i) {
      final boolean g;
      final int h;
      @Nullable
      final yz.a i;

      b(axg $$0) {
         this($$0.cY(), $$0.gI(), true, $$0.g.k(), $$0.a(), $$0.Q(), $$0.a((ddo)ddo.g), $$0.R(), (yz.a)t.a((Object)$$0.ac(), (Function)(yz::a)));
      }

      public b(UUID param1, @Nullable GameProfile param2, boolean param3, int param4, dwl param5, @Nullable yh param6, boolean param7, int param8, @Nullable yz.a param9) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
         this.d = $$3;
         this.e = $$4;
         this.f = $$5;
         this.g = $$6;
         this.h = $$7;
         this.i = $$8;
      }

      public UUID a() {
         return this.a;
      }

      @Nullable
      public GameProfile b() {
         return this.b;
      }

      public boolean c() {
         return this.c;
      }

      public int d() {
         return this.d;
      }

      public dwl e() {
         return this.e;
      }

      @Nullable
      public yh f() {
         return this.f;
      }

      public boolean g() {
         return this.g;
      }

      public int h() {
         return this.h;
      }

      @Nullable
      public yz.a i() {
         return this.i;
      }
   }

   public static enum a {
      a(($$0, $$1) -> {
         String $$2 = (String)aam.z.decode($$1);
         PropertyMap $$3 = (PropertyMap)aam.y.decode($$1);
         $$0.b = new GameProfile($$0.a, $$2, $$3);
      }, ($$0, $$1) -> {
         GameProfile $$2 = (GameProfile)Objects.requireNonNull($$1.b());
         aam.z.encode($$0, $$2.name());
         aam.y.encode($$0, $$2.properties());
      }),
      b(($$0, $$1) -> {
         $$0.i = (yz.a)$$1.c(yz.a::a);
      }, ($$0, $$1) -> {
         $$0.a($$1.i, yz.a::a);
      }),
      c(($$0, $$1) -> {
         $$0.e = dwl.a($$1.l());
      }, ($$0, $$1) -> {
         $$0.c($$1.e().a());
      }),
      d(($$0, $$1) -> {
         $$0.c = $$1.readBoolean();
      }, ($$0, $$1) -> {
         $$0.a($$1.c());
      }),
      e(($$0, $$1) -> {
         $$0.d = $$1.l();
      }, ($$0, $$1) -> {
         $$0.c($$1.d());
      }),
      f(($$0, $$1) -> {
         $$0.f = (yh)wx.a((ByteBuf)$$1, (aap)yj.d);
      }, ($$0, $$1) -> {
         wx.a((ByteBuf)$$0, (Object)$$1.f(), (aaq)yj.d);
      }),
      g(($$0, $$1) -> {
         $$0.h = $$1.l();
      }, ($$0, $$1) -> {
         $$0.c($$1.h);
      }),
      h(($$0, $$1) -> {
         $$0.g = $$1.readBoolean();
      }, ($$0, $$1) -> {
         $$0.a($$1.g);
      });

      final afn.a.a i;
      final afn.a.b j;

      private a(final afn.a.a param3, final afn.a.b param4) {
         this.i = $$0;
         this.j = $$1;
      }

      // $FF: synthetic method
      private static afn.a[] a() {
         return new afn.a[]{a, b, c, d, e, f, g, h};
      }

      public interface a {
         void read(afn.c var1, xq var2);
      }

      public interface b {
         void write(xq var1, afn.b var2);
      }
   }

   private static class c {
      final UUID a;
      @Nullable
      GameProfile b;
      boolean c;
      int d;
      dwl e;
      @Nullable
      yh f;
      boolean g;
      int h;
      @Nullable
      yz.a i;

      c(UUID $$0) {
         this.e = dwl.e;
         this.a = $$0;
      }

      afn.b a() {
         return new afn.b(this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h, this.i);
      }
   }
}
