import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableList.Builder;
import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import it.unimi.dsi.fastutil.objects.ObjectListIterator;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import net.minecraft.server.MinecraftServer;

public record ag(int c, List<amt<fof>> d, List<amt<dqs<?>>> e, Optional<dy> f) {
   public static final Codec<ag> a = RecordCodecBuilder.create(($$0) -> {
      return $$0.group(Codec.INT.optionalFieldOf("experience", 0).forGetter(ag::a), fof.a.listOf().optionalFieldOf("loot", List.of()).forGetter(ag::b), dqs.b.listOf().optionalFieldOf("recipes", List.of()).forGetter(ag::c), dy.a.optionalFieldOf("function").forGetter(ag::d)).apply($$0, ag::new);
   });
   public static final ag b = new ag(0, List.of(), List.of(), Optional.empty());

   public ag(int param1, List<amt<fof>> param2, List<amt<dqs<?>>> param3, Optional<dy> param4) {
      this.c = $$0;
      this.d = $$1;
      this.e = $$2;
      this.f = $$3;
   }

   public void a(axg $$0) {
      $$0.d(this.c);
      axf $$1 = $$0.A();
      MinecraftServer $$2 = $$1.s();
      fod $$3 = (new fod.a($$1)).a((bhv)fqx.a, (Object)$$0).a((bhv)fqx.h, (Object)$$0.dI()).a(fqw.m);
      boolean $$4 = false;
      Iterator var6 = this.d.iterator();

      while(var6.hasNext()) {
         amt<fof> $$5 = (amt)var6.next();
         ObjectListIterator var8 = $$2.be().a($$5).a($$3).iterator();

         while(var8.hasNext()) {
            dlt $$6 = (dlt)var8.next();
            if ($$0.h($$6)) {
               $$1.a((cgk)null, $$0.dP(), $$0.dR(), $$0.dV(), bda.pG, bdb.h, 0.2F, (($$0.ep().i() - $$0.ep().i()) * 0.7F + 1.0F) * 2.0F);
               $$4 = true;
            } else {
               czl $$7 = $$0.a((dlt)$$6, false);
               if ($$7 != null) {
                  $$7.k();
                  $$7.b($$0.cY());
               }
            }
         }
      }

      if ($$4) {
         $$0.cn.d();
      }

      if (!this.e.isEmpty()) {
         $$0.b(this.e);
      }

      this.f.flatMap(($$1x) -> {
         return $$1x.a($$2.aC());
      }).ifPresent(($$2x) -> {
         $$2.aC().a($$2x, $$0.C().a().a((bbn)bbh.c));
      });
   }

   public int a() {
      return this.c;
   }

   public List<amt<fof>> b() {
      return this.d;
   }

   public List<amt<dqs<?>>> c() {
      return this.e;
   }

   public Optional<dy> d() {
      return this.f;
   }

   public static class a {
      private int a;
      private final Builder<amt<fof>> b = ImmutableList.builder();
      private final Builder<amt<dqs<?>>> c = ImmutableList.builder();
      private Optional<amo> d = Optional.empty();

      public static ag.a a(int $$0) {
         return (new ag.a()).b($$0);
      }

      public ag.a b(int $$0) {
         this.a += $$0;
         return this;
      }

      public static ag.a a(amt<fof> $$0) {
         return (new ag.a()).b($$0);
      }

      public ag.a b(amt<fof> $$0) {
         this.b.add($$0);
         return this;
      }

      public static ag.a c(amt<dqs<?>> $$0) {
         return (new ag.a()).d($$0);
      }

      public ag.a d(amt<dqs<?>> $$0) {
         this.c.add($$0);
         return this;
      }

      public static ag.a a(amo $$0) {
         return (new ag.a()).b($$0);
      }

      public ag.a b(amo $$0) {
         this.d = Optional.of($$0);
         return this;
      }

      public ag a() {
         return new ag(this.a, this.b.build(), this.c.build(), this.d.map(dy::new));
      }
   }
}
