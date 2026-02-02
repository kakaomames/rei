import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableMap.Builder;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DataResult;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;
import org.jspecify.annotations.Nullable;

public record ab(Optional<amo> c, Optional<ao> d, ag e, Map<String, ak<?>> f, af g, boolean h, Optional<yh> i) {
   private static final Codec<Map<String, ak<?>>> j;
   public static final Codec<ab> a;
   public static final aao<xq, ab> b;

   public ab(Optional<amo> $$0, Optional<ao> $$1, ag $$2, Map<String, ak<?>> $$3, af $$4, boolean $$5) {
      this($$0, $$1, $$2, Map.copyOf($$3), $$4, $$5, $$1.map(ab::a));
   }

   public ab(Optional<amo> param1, Optional<ao> param2, ag param3, Map<String, ak<?>> param4, af param5, boolean param6, Optional<yh> param7) {
      this.c = $$0;
      this.d = $$1;
      this.e = $$2;
      this.f = $$3;
      this.g = $$4;
      this.h = $$5;
      this.i = $$6;
   }

   private static DataResult<ab> a(ab $$0) {
      return $$0.f().a($$0.e().keySet()).map(($$1) -> {
         return $$0;
      });
   }

   private static yh a(ao $$0) {
      yh $$1 = $$0.a();
      l $$2 = $$0.e().a();
      yh $$3 = yk.a($$1.f(), zf.a.a($$2)).f("\n").b($$0.b());
      yh $$4 = $$1.f().a(($$1x) -> {
         return $$1x.a((yo)(new yo.e($$3)));
      });
      return yk.a((yh)$$4).a($$2);
   }

   public static yh a(ac $$0) {
      return (yh)$$0.b().h().orElseGet(() -> {
         return yh.b($$0.a().toString());
      });
   }

   private void a(xq $$0) {
      $$0.a(this.c, wx::a);
      ao.b.a(aam::a).encode($$0, this.d);
      this.g.a((wx)$$0);
      $$0.a(this.h);
   }

   private static ab b(xq $$0) {
      return new ab($$0.b(wx::q), (Optional)ao.b.a(aam::a).decode($$0), ag.b, Map.of(), new af($$0), $$0.readBoolean());
   }

   public boolean a() {
      return this.c.isEmpty();
   }

   public void a(bgp $$0, je.a $$1) {
      this.f.forEach(($$2, $$3) -> {
         bd $$4 = new bd($$0.a((bgp.f)(new bgp.i($$2))), $$1);
         $$3.b().a($$4);
      });
   }

   public Optional<amo> b() {
      return this.c;
   }

   public Optional<ao> c() {
      return this.d;
   }

   public ag d() {
      return this.e;
   }

   public Map<String, ak<?>> e() {
      return this.f;
   }

   public af f() {
      return this.g;
   }

   public boolean g() {
      return this.h;
   }

   public Optional<yh> h() {
      return this.i;
   }

   static {
      j = Codec.unboundedMap(Codec.STRING, ak.a).validate(($$0) -> {
         return $$0.isEmpty() ? DataResult.error(() -> {
            return "Advancement criteria cannot be empty";
         }) : DataResult.success($$0);
      });
      a = RecordCodecBuilder.create(($$0) -> {
         return $$0.group(amo.a.optionalFieldOf("parent").forGetter(ab::b), ao.a.optionalFieldOf("display").forGetter(ab::c), ag.a.optionalFieldOf("rewards", ag.b).forGetter(ab::d), j.fieldOf("criteria").forGetter(ab::e), af.a.optionalFieldOf("requirements").forGetter(($$0x) -> {
            return Optional.of($$0x.f());
         }), Codec.BOOL.optionalFieldOf("sends_telemetry_event", false).forGetter(ab::g)).apply($$0, ($$0x, $$1, $$2, $$3, $$4, $$5) -> {
            af $$6 = (af)$$4.orElseGet(() -> {
               return af.a((Collection)$$3.keySet());
            });
            return new ab($$0x, $$1, $$2, $$3, $$6, $$5);
         });
      }).validate(ab::a);
      b = aao.a(ab::a, ab::b);
   }

   public static class a {
      private Optional<amo> a = Optional.empty();
      private Optional<ao> b = Optional.empty();
      private ag c;
      private final Builder<String, ak<?>> d;
      private Optional<af> e;
      private af.a f;
      private boolean g;

      public a() {
         this.c = ag.b;
         this.d = ImmutableMap.builder();
         this.e = Optional.empty();
         this.f = af.a.a;
      }

      public static ab.a a() {
         return (new ab.a()).c();
      }

      public static ab.a b() {
         return new ab.a();
      }

      public ab.a a(ac $$0) {
         this.a = Optional.of($$0.a());
         return this;
      }

      /** @deprecated */
      @Deprecated(
         forRemoval = true
      )
      public ab.a a(amo $$0) {
         this.a = Optional.of($$0);
         return this;
      }

      public ab.a a(dlt $$0, yh $$1, yh $$2, @Nullable amo $$3, ai $$4, boolean $$5, boolean $$6, boolean $$7) {
         return this.a(new ao($$0, $$1, $$2, Optional.ofNullable($$3).map(iu.b::new), $$4, $$5, $$6, $$7));
      }

      public ab.a a(dwn $$0, yh $$1, yh $$2, @Nullable amo $$3, ai $$4, boolean $$5, boolean $$6, boolean $$7) {
         return this.a(new ao(new dlt($$0.h()), $$1, $$2, Optional.ofNullable($$3).map(iu.b::new), $$4, $$5, $$6, $$7));
      }

      public ab.a a(ao $$0) {
         this.b = Optional.of($$0);
         return this;
      }

      public ab.a a(ag.a $$0) {
         return this.a($$0.a());
      }

      public ab.a a(ag $$0) {
         this.c = $$0;
         return this;
      }

      public ab.a a(String $$0, ak<?> $$1) {
         this.d.put($$0, $$1);
         return this;
      }

      public ab.a a(af.a $$0) {
         this.f = $$0;
         return this;
      }

      public ab.a a(af $$0) {
         this.e = Optional.of($$0);
         return this;
      }

      public ab.a c() {
         this.g = true;
         return this;
      }

      public ac b(amo $$0) {
         Map<String, ak<?>> $$1 = this.d.buildOrThrow();
         af $$2 = (af)this.e.orElseGet(() -> {
            return this.f.create($$1.keySet());
         });
         return new ac($$0, new ab(this.a, this.b, this.c, $$1, $$2, this.g));
      }

      public ac a(Consumer<ac> $$0, String $$1) {
         ac $$2 = this.b(amo.a($$1));
         $$0.accept($$2);
         return $$2;
      }
   }
}
